import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import TopBar from '@/components/layout/TopBar';
import {
	Field,
	FieldDescription,
	FieldGroup,
	FieldLabel,
	FieldLegend,
	FieldSet,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';

export default function RecordWrite() {
	const navigate = useNavigate();

	function handleSubmit() {
		console.log('Saved:', 'what');
		navigate(-1); // go back to record list
	}

	return (
		<div className="pt-16">
			<TopBar title="New Record" />
			<div className="p-4 space-y-4">
				<form>
					<FieldGroup>
						<FieldSet>
							<FieldLegend>새로운 기록</FieldLegend>
							<FieldDescription>
								새로운 학습상황기록을 작성합니다.
							</FieldDescription>
							<FieldGroup>
								<div className="grid grid-cols-2 gap-4">
									<Field>
										<FieldLabel htmlFor="checkout-7j9-card-name-43j">
											시작 페이지
										</FieldLabel>
										<Input
											id="type"
											autoComplete="off"
											placeholder="11"
										/>
									</Field>
									<Field>
										<FieldLabel htmlFor="checkout-7j9-card-name-43j">
											끝 페이지
										</FieldLabel>
										<Input
											id="type"
											autoComplete="off"
											placeholder="23"
										/>
									</Field>
								</div>
								<Field>
									<FieldLabel htmlFor="checkout-7j9-optional-comments">
										특이사항
									</FieldLabel>
									<Textarea
										id="checkout-7j9-optional-comments"
										placeholder="특이사항을 작성하세요 (예: 24쪽 하다 말았음)"
										className="resize-none"
									/>
								</Field>
							</FieldGroup>
						</FieldSet>
						<Field>
							<Button
								className="w-full"
								onClick={handleSubmit}
							>
								저장하기
							</Button>
						</Field>
					</FieldGroup>
				</form>
			</div>
		</div>
	);
}
